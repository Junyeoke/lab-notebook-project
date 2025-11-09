import React, { useState, useRef, useEffect } from 'react';
import { Container, Navbar, Button } from 'react-bootstrap';
import { FiFileText, FiChevronDown, FiLogOut, FiMenu, FiUser } from 'react-icons/fi';

const Header = ({ user, onGoHome, onShowOffcanvas, onLogout, onNavigateToMyInfo }) => {
    const [showUserPopover, setShowUserPopover] = useState(false);
    const userMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserPopover(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [userMenuRef]);

    return (
        <Navbar bg="light" expand={false} className="app-header">
            <Container fluid>
                <Button variant="outline-secondary" onClick={onShowOffcanvas} className="d-lg-none">
                    <FiMenu />
                </Button>
                <Navbar.Brand onClick={onGoHome} style={{ cursor: 'pointer' }} className="d-flex align-items-center gap-2">
                    <FiFileText />
                    <h1 className="mb-0 h5">LabLog</h1>
                </Navbar.Brand>
                <div ref={userMenuRef} className="user-menu-container">
                    <div className="user-menu-trigger" onClick={() => setShowUserPopover(!showUserPopover)}>
                        {user?.picture && <img src={user.picture} alt="Profile" className="profile-picture" />}
                        <span>{user?.username}님</span>
                        <FiChevronDown style={{ transform: showUserPopover ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                    </div>
                    {showUserPopover && (
                        <div className="user-popover">
                            <div className="user-info">
                                <strong>{user.username}</strong>
                                <small>{user.email}</small>
                                <span className="provider-badge">{user.provider}</span>
                            </div>
                            <button onClick={() => { onNavigateToMyInfo(); setShowUserPopover(false); }} className="popover-button">
                                <FiUser />
                                내정보 관리
                            </button>
                            <button onClick={onLogout} className="popover-button">
                                <FiLogOut />
                                로그아웃
                            </button>
                        </div>
                    )}
                </div>
            </Container>
        </Navbar>
    );
};

export default Header;
